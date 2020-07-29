import {Module } from '@nestjs/common';
import {StatisticsController} from '../controller/statistics.controller';
import {StatisticsService} from '../service/statistics.service';
import { MongooseModule } from '@nestjs/mongoose';
import {BlockSchema} from '../schema/block.schema';
import { NftSchema } from '../schema/nft.schema';
import { TxSchema } from '../schema/tx.schema';
import { ValidatorSchema } from '../schema/validators.schema';

@Module({
    imports:[
        MongooseModule.forFeature([{
            name: 'Block',
            schema: BlockSchema,
            collection: 'block'
        },{
            name: 'Tx',
            schema: TxSchema,
            collection: 'tx_common'
        },{
            name: 'Nft',
            schema: NftSchema,
            collection: 'ex_sync_nft'
        },{
            name: 'Validators',
            schema: ValidatorSchema,
            collection: 'ex_validator'
        }]),
    ],
    providers:[StatisticsService],
    controllers:[StatisticsController],
})
export class StatisticsModule{}
