# BoostSendRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **str** |  | 
**recipient** | **str** | Profile ID, DID, email, or phone number (auto-detected) | 
**contract_uri** | **str** |  | [optional] 
**template_uri** | **str** |  | [optional] 
**template** | [**BoostSendRequestTemplate**](BoostSendRequestTemplate.md) |  | [optional] 
**signed_credential** | [**BoostSendRequestTemplateCredentialAnyOf**](BoostSendRequestTemplateCredentialAnyOf.md) |  | [optional] 
**options** | [**BoostSendRequestOptions**](BoostSendRequestOptions.md) |  | [optional] 
**template_data** | **Dict[str, Optional[object]]** |  | [optional] 
**integration_id** | **str** | Integration ID for activity tracking | [optional] 
**refresh** | **bool** | Request managed credential refresh for this send. Profile/DID recipients use immediate issuance; email/phone recipients use deferred Universal Inbox signing and bind the holder at claim. | [optional] 
**idempotency_key** | **str** | Caller-chosen key that makes a managed refresh send (refresh: true) safe to retry as a whole: retries with the same key reuse the same boost, refresh allocation and result. Reusing a key for a different request is rejected. With signedCredential, requires prior tRPC prepareRefreshableSend; direct REST callers omit the key and retry the exact signed credential and templateUri. | [optional] 

## Example

```python
from openapi_client.models.boost_send_request import BoostSendRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendRequest from a JSON string
boost_send_request_instance = BoostSendRequest.from_json(json)
# print the JSON string representation of the object
print(BoostSendRequest.to_json())

# convert the object into a dict
boost_send_request_dict = boost_send_request_instance.to_dict()
# create an instance of BoostSendRequest from a dict
boost_send_request_from_dict = BoostSendRequest.from_dict(boost_send_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


