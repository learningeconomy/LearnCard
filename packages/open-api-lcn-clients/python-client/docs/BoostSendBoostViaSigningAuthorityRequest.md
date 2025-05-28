# BoostSendBoostViaSigningAuthorityRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**boost_uri** | **str** |  | 
**signing_authority** | [**BoostSendBoostViaSigningAuthorityRequestSigningAuthority**](BoostSendBoostViaSigningAuthorityRequestSigningAuthority.md) |  | 
**options** | [**BoostSendBoostRequestOptions**](BoostSendBoostRequestOptions.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_send_boost_via_signing_authority_request import BoostSendBoostViaSigningAuthorityRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendBoostViaSigningAuthorityRequest from a JSON string
boost_send_boost_via_signing_authority_request_instance = BoostSendBoostViaSigningAuthorityRequest.from_json(json)
# print the JSON string representation of the object
print(BoostSendBoostViaSigningAuthorityRequest.to_json())

# convert the object into a dict
boost_send_boost_via_signing_authority_request_dict = boost_send_boost_via_signing_authority_request_instance.to_dict()
# create an instance of BoostSendBoostViaSigningAuthorityRequest from a dict
boost_send_boost_via_signing_authority_request_from_dict = BoostSendBoostViaSigningAuthorityRequest.from_dict(boost_send_boost_via_signing_authority_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


