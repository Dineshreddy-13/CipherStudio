// const { app, BrowserWindow } = require("electron");
import { app, BrowserWindow, Menu } from "electron";

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
  });
   Menu.setApplicationMenu(null);

  win.loadURL("http://localhost:5173"); // Vite dev server
}

app.whenReady().then(createWindow);
