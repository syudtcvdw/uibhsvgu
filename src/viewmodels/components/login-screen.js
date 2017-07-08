var vm = function (params) {
    let vm = this

    // observables
    vm.loginEmail = ko.observable('')
    vm.loginPwd = ko.observable('')
    vm.loginErr = ko.observable()
    vm.loading = ko.observable(false)
    vm.seen = ko.observable(true)

    // behaviors
    vm.validateCreds = () => {
        vm.loading(true)
        if (_anyEmpty(vm.loginEmail(), vm.loginPwd())) 
            vm.loginErr("All fields are required.");
        
        // send info to socket
        sockets.emit('logon', {
            'email': vm.loginEmail(),
            'password': vm.loginPwd()
        }, (data) => {
            if (!data.status) 
                vm.loginErr("No response from Control Workstation")
            else {
                if (data.response) {
                    console.log("Login Successful!")

                    // remember this email address
                    let DbSettings = db('settings')
                    DbSettings.iu({
                        label: 'lastEmail',
                        value: vm.loginEmail()
                    })

                    // go on
                    if (VM.MODE() != SERVER) 
                        VM.notify("Login successful, welcome")
                    vm.seen(false)
                    vm.start(data.response)
                } else 
                    vm.loginErr("Username/password incorrect!")
            }
        }, quiet = true)
        console.log(`Email: ${vm.loginEmail()} Password: ${vm.loginPwd()}`)
    }
    vm.dismissLoading = () => {
        vm.loading(false)
        vm.loginErr(null)
    }
    vm.start = (data) => {
        vm.seen(false)
        VM.ROLE(data.role)
        VM
            .controlVm
            .personName(data.info.name)
        VM
            .controlVm
            .superAdmin(data.info.is_first)
        VM
            .controlVm
            .personEmail(data.info.email)
        VM.controlVm.personId = data.info._id

        VM.loadView('admins-screen')
        console.log("Starting app...", data)
    }

    // init
    console.log('Login screen: ', params)
    if (typeof params.firstRun != 'undefined' && VM.MODE() == SERVER) {
        vm.start(params) // don't require logon from server-running admin on first run
    }
    let DbSettings = db('settings')
    DbSettings
        .findOne({label: 'lastEmail'})
        .execAsync()
        .then(d => vm.loginEmail(d.value))
        .catch(() => {})
}

new Component('login-screen')
    .def(vm)
    .load()