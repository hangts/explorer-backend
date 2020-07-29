import * as mongoose from 'mongoose';
import { Logger } from '../logger';
import {
    IDeleteQuery,
    INftCountQueryParams,
    INftDetailStruct,
    INftListStruct,
    INftStruct,
} from '../types/schemaTypes/nft.interface';
import { getTimestamp } from '../util/util';

export const NftSchema = new mongoose.Schema({
    denom: String,
    nft_id: String,
    owner: String,
    token_uri: String,
    token_data: String,
    create_time: Number,
    update_time: Number,
    hash: String,
},{versionKey: false});
NftSchema.index({ denom: 1, nft_id: 1 }, { unique: true });

NftSchema.statics = {
    async findList(pageNum: number, pageSize: number, denom?: string, nftId?: string, owner?: string): Promise<INftListStruct[]> {
        const condition = [
            {
                $lookup: {
                    from: 'ex_sync_denom',
                    localField: 'denom',
                    foreignField: 'name',
                    as: 'denomDetail',
                },
            }, {
                $project: {
                    'denomDetail._id': 0,
                    'denomDetail.update_time': 0,
                    'denomDetail.create_time': 0,
                },
            },
        ];
        if (denom || nftId || owner) {
            let cond: any = {
                '$match': {},
            };
            if (denom) cond['$match'].denom = denom;
            if (nftId) cond['$match'].nft_id = nftId;
            if (owner) cond['$match'].owner = owner;
            condition.push(cond);
        }
        return await this.aggregate(condition)
            .skip((Number(pageNum) - 1) * Number(pageSize))
            .limit(Number(pageSize));
    },

    async findOneByDenomAndNftId(denom: string, nftId: string): Promise<INftDetailStruct | null> {
        const res: INftDetailStruct[] = await this.aggregate([
            {
                $lookup: {
                    from: 'ex_sync_denom',
                    localField: 'denom',
                    foreignField: 'name',
                    as: 'denomDetail',
                },
            }, {
                $match: {
                    denom,
                    nft_id: nftId,
                },
            }, {
                $project: {
                    'denomDetail._id': 0,
                    'denomDetail.update_time': 0,
                    'denomDetail.create_time': 0,
                },
            },
        ]);
        if (res.length > 0) {
            return res[0];
        } else {
            return null;
        }
    },

    async findCount(denom: string, nftId: string, owner: string): Promise<number> {
        let query: INftCountQueryParams = {};
        if (denom){
            query.denom = denom;
        }
        if (nftId){
            query.nftId = nftId;
        }
        if (owner){
            query.owner = owner;
        }
        return await this.find(query).countDocuments().exec();
    },
    async findListByName(name: string): Promise<INftStruct> {
        return await this.find({ denom: name }).exec();
    },

    saveBulk(nfts: INftStruct[]): Promise<INftStruct[]> {
        return this.insertMany(nfts, { ordered: false });
    },

    async deleteOneByDenomAndId(nft: IDeleteQuery): Promise<INftStruct> {
        return await this.deleteOne(nft, (e) => {
            if (e) Logger.error('mongo-error:', e.message);
        });
    },

    updateOneById(nft: INftStruct): Promise<INftStruct> {
        const { nft_id, owner, token_data, token_uri, hash } = nft;
        return this.updateOne({
            nft_id
        }, {
            owner,
            token_data,
            token_uri,
            hash,
            update_time: getTimestamp()
        }, 
        (e) => {
            if (e) Logger.error('mongo-error:', e.message);
        });
    },
};