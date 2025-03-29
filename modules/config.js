
const BASE_URLS = {
    "BELGIUM": "https://www.floorballbelgium.be/api/",
    "FRANCE": "https://visu.floorball.fr/api/"
}

class Config {
    // static country = "BELGIUM"
    static country = "FRANCE"

    static getBaseUrl() {
        return BASE_URLS[this.country]
    }
    
}

export { Config }