import { IQueryBase } from '../index';

export interface ITxsQuery extends IQueryBase {
	type?:string,
	status?:string,
	beginTime?:string,
  	endTime?:string,
}

export interface ITxsWithHeightQuery extends IQueryBase {
	height?:string,
}

export interface ITxsWithAddressQuery extends IQueryBase {
	address?:string,
    type?:string,
    status?:string,
}

export interface ITxsWithContextIdQuery extends IQueryBase {
    contextId?:string,
    type?:string,
    status?:string,
}

export interface ITxsWithNftQuery extends IQueryBase {
	denom?:string,
	tokenId?:string,
}

export interface ITxsWithServiceNameQuery extends IQueryBase {
	serviceName?:string,
}

export interface ITxStruct {
    time:number,
    time_unix:number,
    height:number,
    tx_hash:string,
    memo:string,
    status:number,
    log:string,
    complex_msg:boolean,
    type:string,
    from:string,
    to:string,
    coins:object[],
    signer:string,
    events:object[],
    msgs:object[],
    signers:string[]
}

export interface callServiceStruct extends ITxStruct {
    respond?:object[],
}

export interface bindServiceStruct extends ITxStruct {
    respond_times?:number,
}

export interface ITxStructMsgs {
    events:object[],
    msgs:object[],
}

export interface ITxStructHash {
    tx_hash:object[],
    msgs:object[],
}

export interface IExFieldQuery {
    requestContextId?: string;
    consumer?: string;
    serviceName?: string;
    callHash?: string;
    hash: string;
    bind?: number;
}