import { HttpService, Injectable } from '@nestjs/common';
import { cfg } from '../../config/config';
import { Logger } from '../../logger';

@Injectable()
export class NftHttp {
    constructor(){

    }
    async queryNftsFromLcdByDenom(denom: string): Promise<any> {
        const url: string = `${cfg.serverCfg.lcdAddr}/nft/nfts/collections/${denom}`;
        try {
            const data: any = await new HttpService().get(url).toPromise().then(res => res.data);
            if(data && data.result){
                return data.result;
            }else{
                Logger.warn('api-error:', 'there is no result of nft from lcd');
            }

        } catch (e) {
            Logger.warn(`api-error from ${url}:`, e.message);
            // cron jobs error should not throw errors;
        }

    }
}