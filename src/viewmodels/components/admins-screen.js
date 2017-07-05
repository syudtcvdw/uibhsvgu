const vm = function (params) {
    let vm = this

    // observables
    vm.updateName = ko.observable('')
    vm.updatePwd = ko.observable('')
    vm.updateErr = ko.observable()
    vm.loading = ko.observable(false)
    vm.adminDetails = {
        sn: ko.observable(),
        name: ko.observable(),
        email: ko.observable(),
        delete: ko.observable()
    }


    // behaviors
    /**
     * Update admin credentials
     */
    vm.updateCreds = () => {
        vm.loading(true)
        if (emptyFields(vm.updateName(), vm.updatePwd())) 
            vm.updateErr('Fill in all fields, pls.')
            // send to the socket ( update profile )
        console.log(`Email: ${VM.controlVm.personEmail()}`)
        VM
            .socket
            .emit('update profile', {
                'name': vm.updateName(),
                'email': VM
                    .controlVm
                    .personEmail(),
                'password': vm.updatePwd()
            }, (data) => {
							console.log(data)
							console.log('okay...')
                if (data) 
                    VM.notify("Update successful!")
                else 
                    VM.notify("Update failed", "error")
            })
        // change password retrieve first admin's password

    }

    /**
     * Delete admin
     */
    vm.deleteAdmin = (admin) => {
        // remove an admin
    }

    /**
     * Add an admin
     */
    vm.addAdmin = (admin) => {
        // add an admin
    }

    /**
     * Dismiss loadin
     */
    vm.dismissLoading = () => {
        vm.loading(false)
        vm.updateErr(null)
    }

    vm.start = (data) => {
        console.log('starting vm.')
        console.log(data)
    }

    // helper functions
    /**
     * Check for empty fileds
     * @param {*} fields 
     * @return bool
     */
    function emptyFields(...fields) {
        var empty = false
        fields.forEach(items => {
            if (items.trim().length === 0) 
                empty = true
        })
        return empty
    }

}

new Component('admins-screen')
    .def(vm)
    .load()