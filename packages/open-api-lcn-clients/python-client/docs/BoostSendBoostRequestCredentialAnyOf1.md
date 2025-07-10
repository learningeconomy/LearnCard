# BoostSendBoostRequestCredentialAnyOf1


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**protected** | **str** |  | 
**iv** | **str** |  | 
**ciphertext** | **str** |  | 
**tag** | **str** |  | 
**aad** | **str** |  | [optional] 
**recipients** | [**List[BoostSendBoostRequestCredentialAnyOf1RecipientsInner]**](BoostSendBoostRequestCredentialAnyOf1RecipientsInner.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_send_boost_request_credential_any_of1 import BoostSendBoostRequestCredentialAnyOf1

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendBoostRequestCredentialAnyOf1 from a JSON string
boost_send_boost_request_credential_any_of1_instance = BoostSendBoostRequestCredentialAnyOf1.from_json(json)
# print the JSON string representation of the object
print(BoostSendBoostRequestCredentialAnyOf1.to_json())

# convert the object into a dict
boost_send_boost_request_credential_any_of1_dict = boost_send_boost_request_credential_any_of1_instance.to_dict()
# create an instance of BoostSendBoostRequestCredentialAnyOf1 from a dict
boost_send_boost_request_credential_any_of1_from_dict = BoostSendBoostRequestCredentialAnyOf1.from_dict(boost_send_boost_request_credential_any_of1_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


