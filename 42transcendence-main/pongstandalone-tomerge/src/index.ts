import { Pong } from './Pong';
import { MultiViewPong } from './MultiViewPong';
import { Game } from './Game';
import { HelloWorld } from './HelloWorld';

let currentGame: Pong | MultiViewPong | Game | HelloWorld | null = null;

function cleanupCurrentGame() {
    if (currentGame) {
        if ('dispose' in currentGame) {
            (currentGame as any).dispose();
        }
        currentGame = null;
    }
}

document.getElementById('singleViewButton')?.addEventListener('click', () => {
    cleanupCurrentGame();
    currentGame = new Pong('renderCanvas1');
});

document.getElementById('multiViewButton')?.addEventListener('click', () => {
    cleanupCurrentGame();
    currentGame = new MultiViewPong('renderCanvas1');
});

document.getElementById('demoButton')?.addEventListener('click', () => {
    cleanupCurrentGame();
    currentGame = new Game('renderCanvas1');
});

document.getElementById('helloButton')?.addEventListener('click', () => {
    cleanupCurrentGame();
    currentGame = new HelloWorld('renderCanvas1');
});