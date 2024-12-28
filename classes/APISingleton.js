import { SpotifyWebApi } from "../spotify-web-api.js";

export default class APISingleton {
    constructor() {
        if (!APISingleton.instance) {
            APISingleton.instance = new SpotifyWebApi();
            APISingleton.instance.setAccessToken(localStorage.getItem("access-token"));
        }
        return APISingleton.instance;
    }
}