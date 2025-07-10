# BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeader


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**alg** | **str** |  | 
**iv** | **str** |  | 
**tag** | **str** |  | 
**epk** | [**BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk**](BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeaderEpk.md) |  | [optional] 
**kid** | **str** |  | [optional] 
**apv** | **str** |  | [optional] 
**apu** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.boost_send_boost_request_credential_any_of1_recipients_inner_header import BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeader

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeader from a JSON string
boost_send_boost_request_credential_any_of1_recipients_inner_header_instance = BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeader.from_json(json)
# print the JSON string representation of the object
print(BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeader.to_json())

# convert the object into a dict
boost_send_boost_request_credential_any_of1_recipients_inner_header_dict = boost_send_boost_request_credential_any_of1_recipients_inner_header_instance.to_dict()
# create an instance of BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeader from a dict
boost_send_boost_request_credential_any_of1_recipients_inner_header_from_dict = BoostSendBoostRequestCredentialAnyOf1RecipientsInnerHeader.from_dict(boost_send_boost_request_credential_any_of1_recipients_inner_header_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


