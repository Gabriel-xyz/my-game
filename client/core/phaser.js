import { BootScene, InputScene, Scene1 } from '../exports';
import ShockwavePipelinePlugin from 'phaser3-rex-plugins/plugins/shockwavepipeline-plugin.js';
// https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-shockwave/
//1 ^ a camera (or sprite) can only have ONE shockwave effect at a time
let parentId = 'phaser-parent'
export const phaserConfig = {
    type: Phaser.AUTO,
    parent: parentId, // parent field must be set for usage of Phaser's 'DOMElement' thing im using for ui purposes (chat bubbles etc)
    dom: {
        createContainer: true,
        // behindCanvas: false,
        // pointerEvents: 'none',
    },
    title: "Game",
    version: '0.0.0',
    backgroundColor: "rgb(0,0,0)",
    autoFocus: false, // automatically call window.focus() when the game boots
    disableContextMenu: true,
    scene: [BootScene, InputScene, Scene1],
    plugins: {
        global: [
            {
                key: 'rexShockwavePipeline',
                plugin: ShockwavePipelinePlugin,
                start: true
            },
        ]
    },
    loader: {
        baseURL: '',
        path: '../assets/',
        enableParallel: true,
        maxParallelDownloads: 32,
        crossOrigin: undefined,
        responseType: '',
        async: true,
        user: '',
        password: '',
        timeout: 0
    },
    fps: {
        min: 5,
        target: 240,
        forceSetTimeOut: false,
        // deltaHistory: 60,
        // panicMax: 20,
        smoothStep: false, // was false until 10/24/2023
    },
    input: {
        gamepad: false, //default is false
        smoothFactor: 0, //mouse smoothing
        // why im setting targets below: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/domelement/ (its to use domelement system for chat bubbles etc)
        // mouse: { target: parentId },
        // touch: { target: parentId },
    },
    render: {
        antialias: true,
        antialiasGL: false, // bad fps when true. goes from 50% gpu to 100%
        roundPixels: false,
    },
    scale: {
        width: screen.width,
        height: screen.height,
        expandParent: true,
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        resizeInterval: 500,
        autoRound: false, // important to be 'true' for mobile supposedly https://newdocs.phaser.io/docs/3.60.0/Phaser.Scale.ScaleManager#autoRound
        zoom: 1 // doesnt seem to do anything. im told this has nothing to do with camera zoom and is instead 'canvas zoom' whatever that is. UPDATE: samme says "it's for scale mode NONE, really. with FIT etc. it would be counterproductive"
    },
    physics: {
        default: 'arcade',
        arcade: {
            fps: 60,
            gravity: { x: 0, y: 0 },
            debug: false,
        }
    },
}
export const game = new Phaser.Game(phaserConfig)