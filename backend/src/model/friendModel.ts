export interface IGetFriend{
    id : number
    username : string
    display_name : string
    avatar_url : string
    is_online : boolean
    last_seen : string
    status : string
    friendship_date : string
}

export interface IpendingFriend{
    id : number
    username : string
    display_name : string
    avatar_url : string
    request_date : string
}