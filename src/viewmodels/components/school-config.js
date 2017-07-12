var vm = function (params) {
	let vm = this

	// local vars
	let termsPerSessionLabels = ['Two', 'Three', 'Four', 'Five']
	let termsPerSessionArr = []
	for (let i = 1; i <= termsPerSessionLabels.length; i++) 
		termsPerSessionArr[i - 1] = new TermsPerSessHandler(i + 1, termsPerSessionLabels[i - 1])

	// school props
	let logoUri = DEFAULT_SCHOOL_LOGO
	vm.logo = ko.observable()
	vm.schoolName = ko.observable()
	vm.schoolSlogan = ko.observable()
	vm.schoolAddress = ko.observable()
	vm.schoolDisplaysPositions = ko.observable()

	// ops & terminology
	vm.termsPerSessionLists = ko.observableArray(termsPerSessionArr)
	vm.subSession = ko.observable('term')
	vm.sessionName = ko.observable()
	vm.termsPerSession = ko.observable()
	vm.currentTerm = ko.observable()

	// grading system
	vm.gradingSysFields = ko.observableArray()

	// states
	vm.logoChanged = ko.observable(false)
	vm.uiVisible = ko.observable(false)
	vm.uploadingLogo = ko.observable(false)
	vm.updatingProfile = ko.observable(false)
	vm.updatingOps = ko.observable(false)

	// behaviours
	vm.selectLogo = () => {
		let file = remote
			.dialog
			.showOpenDialog({
				title: "Choose school logo",
				message: "Choose school logo",
				filters: [
					{
						name: "Images",
						extensions: ['jpg', 'png', 'gif', 'jpeg']
					}
				]
			})
		if (file) {
			vm.logo(file)
			vm.logoChanged(true)
		}
	}
	vm.resetLogo = () => {
		vm.logo(logoUri)
		vm.logoChanged(false)
	}
	vm.uploadLogo = () => {
		vm.uploadingLogo(true)
		// set up canvas
		let canvas = document.getElementById('canva'),
			ctx = canvas.getContext('2d')
		ctx.fillStyle = "#fdfffc"
		ctx.fillRect(0, 0, 512, 512)

		// draw
		let src = $('.school-logo')[0]
		_dimens = dimens(512)
		_offset = offset(_dimens, 512)
		ctx.drawImage(src, _offset.l, _offset.t, _dimens.w, _dimens.h)

		// save it up
		let canvasBuffer = require('electron-canvas-to-buffer')
		let buf = canvasBuffer(canvas, 'image/jpeg', 70)
		sockets.emit('update school logo', buf, d => {
			vm.uploadingLogo(false)
			if (!d.status) 
				VM.notify("Unable to reach server on Control Workstation", "error")
			else {
				if (!d.response) 
					VM.notify("Logo upload failed", "error")
				else 
					VM.notify("Logo uploaded successfully")
			}
		}, false, 10000)
	}
	vm.updateProfile = () => {
			if (_anyEmpty(vm.schoolName(), vm.schoolSlogan(), vm.schoolAddress())) 
					return VM.notify('You cannot leave any field empty', 'warn'),
					null
			vm.updatingProfile(true)
			let DbSettings = db('settings')
			DbSettings.iu([
					{
						label: 'schoolName',
						value: vm.schoolName()
					}, {
						label: 'schoolSlogan',
						value: vm.schoolSlogan()
					}, {
						label: 'schoolAddress',
						value: vm.schoolAddress()
					}, {
						label: 'schoolDisplaysPositions',
						value: vm.schoolDisplaysPositions()
					}
			]).then(d => {
					VM
							.controlVm
							.schoolName(vm.schoolName())
					VM.controlVm.schoolSlogan = vm.schoolSlogan()
					VM.controlVm.schoolAddress = vm.schoolAddress()
					VM.controlVm.schoolDisplaysPositions = vm.schoolDisplaysPositions()

					VM.notify("Profile updated successfully")
					vm.updatingProfile(false)
			}).catch(e => {
					VM.notify("Unable to update school profile", "error")
					vm.updatingProfile(false)
			})
	}
	vm.updateOpsAndTerms = () => {
			// check if any filed is empty
			if (_anyEmpty(vm.subSession(), vm.sessionName(), vm.termsPerSession(), vm.currentTerm())) 
					return VM.notify('Please select all fields as appropriate', 'warn'),
					null

			vm.updatingOps(true)
			// send info to the socket
			sockets.emit('set ops & term', {
					'schoolSubSession': vm.subSession(),
					'schoolSessionName': vm.sessionName(),
					'schoolTermsPerSession': vm.termsPerSession(),
					'schoolCurrentTerm': vm.currentTerm()
			}, data => {
				if (!data.status) 
					return VM.notify('Problem updating Operations and Terminology, could not reach Control Workstation', 'error')
				else {
					if (data.response) {
							let DbSettings = db('settings')
							DbSettings.iu([
								{
									label: 'schoolSubSession',
									value: vm.subSession()
								}, {
									label: 'schoolSessionName',
									value: vm.sessionName()
								}, {
									label: 'schoolTermsPerSession',
									value: vm.termsPerSession()
								}, {
									label: 'schoolCurrentTerm',
									value: vm.currentTerm()
								}
							]).then(d => {
								VM.controlVm.schoolSubSession = vm.subSession()
								VM.controlVm.schoolSessionName = vm.sessionName()
								VM.controlVm.schoolTermsPerSession = vm.termsPerSession()
								VM.controlVm.schoolCurrentTerm = vm.currentTerm()

								VM.notify('Operations and Terminology successfully updated!')
								vm.updatingOps(false)
							}).catch(e => {
								VM.notify("Unable to update Operations and Terminology", "error")
								vm.updatingOps(false)
							})
					} else {
						VM.notify("Unable to update Operations and Terminology", "error")
						vm.updatingOps(false)
					}
				}
			})
	}
	vm.addField = () => {
		// +1 grade filed when 
		const lastScore = vm.gradingSysFields()[vm.gradingSysFields().length-1].score
		vm.gradingSysFields.push(gradingSysHandler(null, null, lastScore))
	}
	
	// subscription
	vm
		.logoChanged
		.subscribe(b => {
			if (b) 
				_.defer(() => tooltip.refresh())
		})

	// computed
	vm.currentTermList = ko.computed(() => {
		// dynamically generate list of curr terms
		const currTermLabels = ['First', 'Second', 'Third', 'Fourth', 'Fifth']
		let newCurrTermList = []
		for (let i = 0; i < vm.termsPerSession(); i++) 
			newCurrTermList[i] = new TermsPerSessHandler(i + 1, currTermLabels[i])
		return newCurrTermList
	})

	// local
	function dimens(max = 800) {
		let el = $('.school-logo')[0]
		var _width = el.width;
		var _height = el.height;

		aspect_ratio = Math.max(_width, _height);
		_width = (_width / aspect_ratio) * max;
		_height = (_height / aspect_ratio) * max;

		return {'w': _width, 'h': _height}
	}

	function offset(dimen, against = 800) {
		let _l = -(dimen.w - against) / 2;
		let _t = -(dimen.h - against) / 2;
		return {'l': _l, 't': _t}
	}

	function TermsPerSessHandler(val, name) {
		this.val = val
		this.name = name
	}

	function gradingSysHandler(grade=null, score=null, max=100) {
		return {
			grade: grade,
			score: score,
			max: max
		}
	}

	// init
	_.defer(() => {
		// setup tooltips
		tooltip.refresh()

		// when logo is loaded
		$('.school-logo').on('load', function () {
			// match heights because the profile pic card is the standard
			$('.card').matchHeight({
			})
			vm.uiVisible(true)
		})

		// set logo src
		fs.exists(USERDATA_ASSETS_PATH + 'logo.jpg', b => {
			if (b) 
				logoUri = USERDATA_ASSETS_PATH + 'logo.jpg'
			vm.logo(logoUri)
		})

		// load school info
		vm.schoolName(VM.controlVm.schoolName())
		vm.schoolSlogan(VM.controlVm.schoolSlogan)
		vm.schoolAddress(VM.controlVm.schoolAddress)
		vm.schoolDisplaysPositions(VM.controlVm.schoolDisplaysPositions)
		vm.subSession(VM.controlVm.schoolSubSession)
		vm.sessionName(VM.controlVm.schoolSessionName)
		vm.termsPerSession(VM.controlVm.schoolTermsPerSession)
		vm.currentTerm(VM.controlVm.schoolCurrentTerm)

		// confirm logo from server
		let DbSettings = db('settings')
		DbSettings
			.findOne({label: 'logoSalt'})
			.execAsync()
			.then(d => {
					sockets.emit('fetch school logo', {
						salt: d
							? d.value
							: ''
					}, d => {
						console.log('Logo fetched', d)
						if (d.status && d.response && d.response.buf) {
							// buffer returned, meaning logo has changed
							_saveLogo(d.response)
						}
					}, true, 10000)
				})
				.catch(() => {})
	})
}

new Component('school-config')
	.def(vm)
	.load()