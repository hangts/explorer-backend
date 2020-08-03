import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ListStruct, Result } from '../api/ApiResult';
import {
    TxListReqDto,
    TxListWithHeightReqDto,
    TxListWithAddressReqDto,
    TxListWithContextIdReqDto,
    TxListWithNftReqDto,
    TxListWithServicesNameReqDto,
    ServicesDetailReqDto,
    TxListWithCallServiceReqDto,
    TxListWithRespondServiceReqDto,
    PostTxTypesReqDto,
    PutTxTypesReqDto,
    DeleteTxTypesReqDto,
    TxWithHashReqDto,
    ServiceListReqDto,
    ServiceProvidersReqDto,
    ServiceTxReqDto,
    ServiceBindInfoReqDto, 
    ServiceRespondReqDto,
} from '../dto/txs.dto';
import {
    TxResDto,
    TxTypeResDto,
    callServiceResDto,
    ServiceResDto,
    RespondServiceResDto,
    ServiceProvidersResDto,
    ServiceTxResDto,
    ServiceBindInfoResDto,
    ServiceRespondResDto
} from '../dto/txs.dto';
import { IBindTx, IServiceName } from '../types/tx.interface';
import { ITxStruct } from '../types/schemaTypes/tx.interface';
import { INftMapStruct } from '../types/schemaTypes/nft.interface';
import { getReqContextIdFromEvents, getServiceNameFromMsgs } from '../helper/tx.helper';

@Injectable()
export class TxService {
    constructor(@InjectModel('Tx') private txModel: any,
                @InjectModel('TxType') private txTypeModel: any,
                @InjectModel('NftMap') private nftMapModel: any) {
    }

    // txs
    async queryTxList(query: TxListReqDto): Promise<ListStruct<TxResDto[]>> {
        let txListData = await this.txModel.queryTxList(query);
        return new ListStruct(TxResDto.bundleData(txListData.data), Number(query.pageNum), Number(query.pageSize), txListData.count);
    }

    // txs/blocks
    async queryTxWithHeight(query: TxListWithHeightReqDto): Promise<ListStruct<TxResDto[]>> {
        let txListData = await this.txModel.queryTxWithHeight(query);
        return new ListStruct(TxResDto.bundleData(txListData.data), Number(query.pageNum), Number(query.pageSize), txListData.count);
    }

    //  txs/addresses
    async queryTxWithAddress(query: TxListWithAddressReqDto): Promise<ListStruct<TxResDto[]>> {
        let txListData = await this.txModel.queryTxWithAddress(query);
        return new ListStruct(TxResDto.bundleData(txListData.data), Number(query.pageNum), Number(query.pageSize), txListData.count);
    }

    //  txs/relevance
    async queryTxWithContextId(query: TxListWithContextIdReqDto): Promise<ListStruct<TxResDto[]>> {
        let txListData = await this.txModel.queryTxWithContextId(query);
        return new ListStruct(TxResDto.bundleData(txListData.data), Number(query.pageNum), Number(query.pageSize), txListData.count);
    }

    //  txs/nfts
    async queryTxWithNft(query: TxListWithNftReqDto): Promise<ListStruct<TxResDto[]>> {
        let txListData = await this.txModel.queryTxWithNft(query);
        return new ListStruct(TxResDto.bundleData(txListData.data), Number(query.pageNum), Number(query.pageSize), txListData.count);
    }

    //  txs/services
    async queryTxWithServiceName(query: TxListWithServicesNameReqDto): Promise<ListStruct<TxResDto[]>> {
        let txListData = await this.txModel.queryTxWithServiceName(query);
        return new ListStruct(TxResDto.bundleData(txListData.data), Number(query.pageNum), Number(query.pageSize), txListData.count);
    }

    //  txs/services/call-service
    async queryTxWithCallService(query: TxListWithCallServiceReqDto): Promise<ListStruct<callServiceResDto[]>> {
        let callServices = await this.txModel.queryCallServiceWithConsumerAddr(query.consumerAddr, query.pageNum, query.pageSize, query.useCount);
        if (callServices && callServices.data) {
            for(let item of callServices.data){
                let context_id:string = getReqContextIdFromEvents(item.events);
                if (context_id && context_id.length) {
                    let respond = await this.txModel.queryRespondServiceWithContextId(context_id);
                    item.respond = respond || [];
                }else{
                    item.respond = [];
                }
            }
        }
        return new ListStruct(callServiceResDto.bundleData(callServices.data), Number(query.pageNum), Number(query.pageSize), callServices.count);
    }

    //  txs/services/respond-service
    async queryTxWithRespondService(query: TxListWithRespondServiceReqDto): Promise<ListStruct<TxResDto[]>> {
        let bindServices = await this.txModel.queryBindServiceWithProviderAddr(query.providerAddr, query.pageNum, query.pageSize, query.useCount);
        if (bindServices && bindServices.data) {
            for(let item of bindServices.data){
                let serviceName:string = getServiceNameFromMsgs(item.msgs);
                item.respond_times = 0;
                item.unbinding_time = 0;
                if (serviceName && serviceName.length) {
                    let respond_times = await this.txModel.queryRespondCountWithServceName(serviceName, query.providerAddr);
                    let disableTxs = await this.txModel.querydisableServiceBindingWithServceName(serviceName, query.providerAddr);
                    item.respond_times = respond_times;
                    if (disableTxs && disableTxs.length) {
                        item.unbinding_time = disableTxs[0].time;
                    }
                }
            }
        }
        return new ListStruct(RespondServiceResDto.bundleData(bindServices.data), Number(query.pageNum), Number(query.pageSize), bindServices.count);
    }

    //  txs/services/detail/{serviceName}
    async queryTxDetailWithServiceName(query: ServicesDetailReqDto): Promise<TxResDto> {
        let result: TxResDto | null = null;
        let txData = await this.txModel.queryTxDetailWithServiceName(query.serviceName);
        if (txData) {
            result = new TxResDto(txData);
        }
        return result;
    }

    //  txs/types
    async queryTxTypeList(): Promise<ListStruct<TxTypeResDto[]>> {
        let txTypeListData = await this.txTypeModel.queryTxTypeList();
        return new ListStruct(TxTypeResDto.bundleData(txTypeListData), Number(0), Number(0));
    }

    async queryServiceTxTypeList(): Promise<ListStruct<TxTypeResDto[]>> {
        let txTypeListData = await this.txTypeModel.queryServiceTxTypeList();
        return new ListStruct(TxTypeResDto.bundleData(txTypeListData), Number(0), Number(0));
    }



    //  post txs/types
    async insertTxTypes(prarms: PostTxTypesReqDto): Promise<ListStruct<TxTypeResDto[]>> {
        let txTypeListData = await this.txTypeModel.insertTxTypes(prarms.typeNames);
        return new ListStruct(TxTypeResDto.bundleData(txTypeListData), Number(0), Number(0));
    }

    //  put txs/types
    async updateTxType(prarms: PutTxTypesReqDto): Promise<TxTypeResDto> {
        let result: TxTypeResDto | null = null;
        let txData = await this.txTypeModel.updateTxType(prarms.typeName, prarms.newTypeName);
        if (txData) {
            result = new TxTypeResDto(txData);
        }
        return result;
    }

    //  delete txs/types
    async deleteTxType(prarms: DeleteTxTypesReqDto): Promise<TxTypeResDto> {
        let result: TxTypeResDto | null = null;
        let txData = await this.txTypeModel.deleteTxType(prarms.typeName);
        if (txData) {
            result = new TxTypeResDto(txData);
        }
        return result;
    }

    async findServiceList(query: ServiceListReqDto): Promise<ListStruct<ServiceResDto[]>> {
        const { serviceName,pageNum, pageSize, useCount } = query;
        const serviceTxList: ITxStruct[] = await (this.txModel as any).findServiceList(serviceName,pageNum, pageSize, useCount);
        const serviceNameList: IServiceName[] = serviceTxList.map((item: any) => {
            let ex:any = item.msgs[0].msg.ex || {};
            return {
                serviceName: ex.service_name || '',
                description: item.msgs[0].msg.description,
                bind: ex.bind || 0,
            };
        });

        for (let name of serviceNameList) {
            if (name.bind && name.bind > 0) {
                const bindServiceTxList: ITxStruct[] = await (this.txModel as any).findBindServiceTxList(name.serviceName);
                const bindTxList: IBindTx[] = bindServiceTxList.map((item: any) => {
                    return {
                        provider: item.msgs[0].msg.provider,
                        bindTime: item.time,
                    };
                });
                //查出每个provider在当前绑定的serviceName下所有的绑定次数
                for (let bindTx of bindTxList) {
                    bindTx.respondTimes = await (this.txModel as any).findProviderRespondTimesForService(name.serviceName, bindTx.provider);
                }
                name.bindList = bindTxList;
            } else {
                name.bindList = [];
            }
        }
        const res: ServiceResDto[] = serviceNameList.map((service: IServiceName) => {
            return new ServiceResDto(service.serviceName, service.description, service.bindList);
        });
        let count: number = 0;
        if (useCount) {
            count = await (this.txModel as any).findAllServiceCount();
        }
        return new ListStruct(res, pageNum, pageSize, count);
    }

    async queryServiceProviders(query: ServiceProvidersReqDto): Promise<ListStruct<ServiceProvidersResDto[]>> {
        const { serviceName, pageNum, pageSize, useCount } = query;
        const bindServiceTxList: ITxStruct[] = await (this.txModel as any).findBindServiceTxList(serviceName, pageNum, pageSize);
        const bindTxList: IBindTx[] = bindServiceTxList.map((item: any) => {
            return {
                provider: item.msgs[0].msg.provider,
                bindTime: item.time,
            };
        });
        console.log(query, bindServiceTxList);
        //查出每个provider在当前绑定的serviceName下所有的绑定次数
        for (let bindTx of bindTxList) {
            bindTx.respondTimes = await (this.txModel as any).findProviderRespondTimesForService(serviceName, bindTx.provider);
        }
        const res: ServiceProvidersResDto[] = bindTxList.map((service: ServiceProvidersResDto) => {
            return new ServiceProvidersResDto(service.provider, service.respondTimes, service.bindTime);
        });

        let count: number = 0;
        if (useCount) {
            count = await (this.txModel as any).findServiceProviderCount(serviceName);
        }
        return new ListStruct(res, pageNum, pageSize, count);
    }

    async queryServiceTx(query: ServiceTxReqDto): Promise<ListStruct<ServiceTxResDto[]>> {
        const { serviceName, type, status, pageNum, pageSize, useCount } = query;
        const txList: ITxStruct[] = await (this.txModel as any).findServiceTx(serviceName, type, status, pageNum, pageSize);
        const res: ServiceTxResDto[] = txList.map((service: ITxStruct) => {
            return new ServiceTxResDto(service.tx_hash, service.type, service.height, service.time, service.status, service.msgs, service.events);
        });
        let count: number = 0;
        if (useCount) {
            count = await (this.txModel as any).findServiceTxCount(serviceName, type, status);
        }
        return new ListStruct(res, pageNum, pageSize, count);
    }

    async queryServiceBindInfo(query: ServiceBindInfoReqDto): Promise<ServiceBindInfoResDto | null> {
        const { serviceName, provider } = query;

        const bindTx: ITxStruct = await (this.txModel as any).findBindTx(serviceName, provider);
        const defineTx: ITxStruct = await (this.txModel as any).findServiceOwner(serviceName);
        if (bindTx && defineTx) {
            const hash = bindTx.tx_hash;
            const time = bindTx.time;
            const owner = (defineTx as any).msgs[0].msg.author;
            return new ServiceBindInfoResDto(hash, owner, time);
        } else {
            return null;
        }
    }

    async queryServiceRespondTx(query: ServiceRespondReqDto): Promise<ListStruct<ServiceRespondResDto[]>> {
        const { serviceName, provider, pageNum, pageSize, useCount } = query;
        const respondTxList: ITxStruct[] = await (this.txModel as any).queryServiceRespondTx(serviceName, provider, pageNum, pageSize);
        const res: ServiceRespondResDto[] = respondTxList.map((service: ITxStruct) => {
            let ex:any = (service.msgs as any)[0].msg.ex || {};
            return new ServiceRespondResDto(
                service.tx_hash,
                service.type,
                service.height,
                service.time,
                ex.consumer || '',
                ex.call_hash || '',
                ex.request_context_id || '',
                ex.service_name || '',
                service.status,
            );
        });
        let count: number = 0;
        if (useCount) {
            count = await (this.txModel as any).findRespondServiceCount(serviceName, provider);
        }
        return new ListStruct(res, pageNum, pageSize, count);

    }

    //  txs/{hash}
    async queryTxWithHash(query: TxWithHashReqDto): Promise<TxResDto> {
        let result: TxResDto | null = null;
        let txData: any = await this.txModel.queryTxWithHash(query.hash);
        if (txData) {
            if (txData.msgs[0] && txData.msgs[0].msg && txData.msgs[0].msg.denom && txData.msgs[0].msg.denom.length) {
                let nftName : INftMapStruct = await this.nftMapModel.findName(txData.msgs[0].msg.denom, txData.msgs[0].msg.id || '');
                txData.msgs[0].msg.denom_name =  nftName ? nftName.denom_name : '';
                txData.msgs[0].msg.nft_name =  nftName ? nftName.nft_name : '';
            }
            result = new TxResDto(txData);
        }
        return result;
    }

}

