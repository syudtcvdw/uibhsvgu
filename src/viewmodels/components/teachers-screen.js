const vm = function (params) {
    let vm = this

    // props
    let controlla

    // observables
    vm.teachers = ko.observableArray()
    vm.newTeacher = ko.observable()
    vm.confirmPassword = ko.observable()

    // states
    vm.connected = ko.observable(false)
    vm.teachersFetchFailed = ko.observable(false)

    // behaviours
    vm.addTeacher = () => {
        vm.confirmPassword(null)
        vm.newTeacher(new Teacher)
        _tooltip()
    }
    vm.dismissAdd = () => {
        vm.newTeacher(null)
        _tooltip()
    }
    vm.loadTeachers = () => {
        sockets.emit('get all teachers', null, data => {
            if (!data.status) {
                vm.teachersFetchFailed(true)
                VM.notify("Unable to fetch teachers list, could not reach Control Workstation", "error", {
                    'try again': vm.loadTeachers
                }, 'retry load teachers')
            } else {
                vm.teachersFetchFailed(false)
                if (data.response) {
                    data
                        .response
                        .map(t => {
                            vm
                                .teachers
                                .push(new Teacher(t))
                        })
                    vm.connected(true)
                    _tooltip()
                }
            }
        }, true)
    }

    // sub-vm
    function Teacher() {
        let t = this
        let args = arguments.length > 0
            ? arguments[0]
            : {}

        // props
        t._id = ko.observable(args._id || '')
        t.name = ko.observable(args.name || '')
        t.email = ko.observable(args.email || '')
        t.phone = ko.observable(args.phone || '')
        t.password = ko.observable(args.password || '')
        t.gender = ko.observable(args.gender || '')
        t.addDate = ko.observable(args.addDate || null)

        // states
        t.saving = ko.observable(false)

        // behaviours
        t.save = () => {
            if (_anyEmpty(t.name(), t.email(), t.phone(), _new
                ? t.password()
                : 'empty')) 
                return VM.notify("Do not leave any detail empty", "warn")

            let teacher = ko.toJS(t)
            delete teacher.saving // not needed

            if (_new) {
                // add
                if (t.password() != vm.confirmPassword()) 
                    return VM.notify("Passwords do not match, use the reveal buttons to comfirm", "error")

                t.saving(true)
                teacher.addDate = teacher.addDate
                    ? teacher.addDate
                    : _getUTCTime() / 1000 // to secs
                delete teacher._id
                sockets.emit('add teacher', teacher, data => {
                    if (!data.status) 
                        return t.saving(false),
                        VM.notify('Problem adding teacher, could not reach Control Workstation', 'error', {
                            'try again': t.save
                        }, 'retry add teacher')
                    else {
                        console.log(data)
                        if (typeof data.response == 'object') {
                            VM.notify('Teacher added successfully.')
                            vm
                                .teachers
                                .push(new Teacher(data.response))
                            vm.addTeacher()
                        } else if (data.response === false) 
                            VM.notify('Unable to add teacher', 'error')
                        else 
                            VM.notify(data.response, 'error')
                        t.saving(false)
                    }
                })
            }
        }

        // init
        let _new = !t._id()
    }

    // init
    _.defer(() => {
        controlla = $('.sectionizr').sectionize()
        vm.loadTeachers()
    })

}

new Component('teachers-screen')
    .def(vm)
    .load()