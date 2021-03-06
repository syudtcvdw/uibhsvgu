//const electron = require('electron')
//const BrowserWindow = electron.BrowserWindow
const {app,BrowserWindow} = require('electron')
const {enableLiveReload} = require('electron-compile')

//handle setupevents as quickly as possible
//const setupEvents = require('../installers/win-squirrel-events')
//if (!setupEvents.handleSquirrelEvent()) {

    // Keep a global reference of the window object, if you don't, the window will
    // be closed automatically when the JavaScript object is garbage collected.
    let mainWindow;

    const isDevMode = process.execPath.match(/[\\/]electron/);

    if (isDevMode) {
        enableLiveReload();
        app.setName("Digischools")
    }

    const createWindow = async() => {
        // Create the browser window.
        mainWindow = new BrowserWindow({
            show: false,
            backgroundColor: '#232332',
            fullScreen: true,
            title: 'DigiSchools',
            autoHideMenuBar: true,
            minWidth: 800,
            minHeight: 600,
            icon: __dirname + '/resx/icon.ico'
        });
        global.thisApp = app

        // remove the menu bar
        mainWindow.setMenu(null);

        // and load the index.html of the app.
        mainWindow.loadURL(`file://${__dirname}/index.html`);

        // Open the DevTools.
        if (isDevMode) {
            mainWindow.webContents.openDevTools();
        }

        // Emitted when the window is closed.
        mainWindow.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null;
        });

        // show window gracefully
        mainWindow.once('ready-to-show', () => {
            // mainWindow.app = app;
            mainWindow.show()
        });
    };

    const shouldQuit = app.makeSingleInstance((commandLine,  workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })

    if (shouldQuit) app.quit()

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', createWindow);

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) {
            createWindow();
        }
    });

    // In this file you can include the rest of your app's specific main process
    // code. You can also put them in separate files and import them here.

//}
