# BoostSend200ResponseInboxRefresh


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**refresh_id** | **str** |  | 
**refresh_service** | [**BoostSend200ResponseInboxRefreshRefreshService**](BoostSend200ResponseInboxRefreshRefreshService.md) |  | 
**credential_id** | **str** |  | 
**issuer_did** | **str** |  | 
**credential_status** | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md) |  | [optional] 
**holder_did** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.boost_send200_response_inbox_refresh import BoostSend200ResponseInboxRefresh

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSend200ResponseInboxRefresh from a JSON string
boost_send200_response_inbox_refresh_instance = BoostSend200ResponseInboxRefresh.from_json(json)
# print the JSON string representation of the object
print(BoostSend200ResponseInboxRefresh.to_json())

# convert the object into a dict
boost_send200_response_inbox_refresh_dict = boost_send200_response_inbox_refresh_instance.to_dict()
# create an instance of BoostSend200ResponseInboxRefresh from a dict
boost_send200_response_inbox_refresh_from_dict = BoostSend200ResponseInboxRefresh.from_dict(boost_send200_response_inbox_refresh_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


