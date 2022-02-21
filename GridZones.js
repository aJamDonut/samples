class GridZones {

    constructor() {
        let rng = game.rng;
        let settings = {
            seed: 0.22323,
            regions: 100,
            ashArea: {
                seed: 0.222,
                scale: 0.121,
                xInc: rng(1,3)/100,
                yInc: rng(1,3)/100,
                xOff: rng(1,99),
                yOff: rng(1,99),
                threshold: 0.1
            },
            snowArea: {
                seed: 0.222,
                scale: 0.05,
                xInc: rng(1,3)/100,
                yInc: rng(1,3)/100,
                xOff: rng(1,99),
                yOff: rng(1,99),
                threshold: 0.1
            }
        }
    
        let snowPreload = '{"seed":0.222,"scale":0.05,"xInc":0.01,"yInc":0.03,"xOff":206,"yOff":568,"threshold":0.1}';
        let ashPreload = '{"seed":0.222,"scale":0.121,"xInc":0.01,"yInc":0.02,"xOff":98,"yOff":64.5,"threshold":0.1}';

        settings.ashArea = JSON.parse(ashPreload);
        settings.snowArea = JSON.parse(snowPreload);
        
        this.ashNoise = new SimplexNoise(settings.ashArea.seed);
        this.snowNoise = new SimplexNoise(settings.snowArea.seed);
        
        this.settings = settings;

    }


    isSnow(x, y){
        if(y > 600) {
            return;
        }
    
        let noise = this.snowNoise;

        let settings = this.settings;
    
        let scalingValue = 100 - (100 * settings.snowArea.scale);
    
        let noiseX = x + (settings.snowArea.xOff*scalingValue);
        let noiseY = y + (settings.snowArea.yOff*scalingValue);
    
        let incX = settings.snowArea.xInc * settings.snowArea.scale;
        let incY = settings.snowArea.yInc * settings.snowArea.scale;
    
        let noiseVal = noise.noise2D(noiseX*incX, noiseY*incY);
    
        let threshold = settings.snowArea.threshold;
        if(noiseVal < threshold*0.9 && y > 250) {
            return false;
        }
        return true;
    }

    isAsh(x, y){

        if(x > 500 || y > 500) {
            return;
        }
    
        let noise = this.ashNoise;
        let settings = this.settings;
        let scalingValue = 100 - (100 * settings.ashArea.scale);
    
        let noiseX = x + (settings.ashArea.xOff*scalingValue);
        let noiseY = y + (settings.ashArea.yOff*scalingValue);
    
        let incX = settings.ashArea.xInc * settings.ashArea.scale;
        let incY = settings.ashArea.yInc * settings.ashArea.scale;
    
    
        let noiseVal = noise.noise2D(noiseX*incX, noiseY*incY);
    
        let threshold = settings.ashArea.threshold;
        if(noiseVal < threshold*0.2 && !(x < 200 && y < 200)) {
            return false;
        }
    
        return true;
    
    }

}