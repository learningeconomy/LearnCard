# BoostSendBoostRequestCredentialAnyOfIssuerAnyOf


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | [optional] 
**type** | [**BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType**](BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType.md) |  | [optional] 
**name** | **str** |  | [optional] 
**url** | **str** |  | [optional] 
**phone** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**endorsement** | **List[object]** |  | [optional] 
**image** | [**BoostSendBoostRequestCredentialAnyOfIssuerAnyOfImage**](BoostSendBoostRequestCredentialAnyOfIssuerAnyOfImage.md) |  | [optional] 
**email** | **str** |  | [optional] 
**address** | [**BoostSendBoostRequestCredentialAnyOfIssuerAnyOfAddress**](BoostSendBoostRequestCredentialAnyOfIssuerAnyOfAddress.md) |  | [optional] 
**other_identifier** | [**List[BoostSendBoostRequestCredentialAnyOfIssuerAnyOfOtherIdentifierInner]**](BoostSendBoostRequestCredentialAnyOfIssuerAnyOfOtherIdentifierInner.md) |  | [optional] 
**official** | **str** |  | [optional] 
**parent_org** | **object** |  | [optional] 
**family_name** | **str** |  | [optional] 
**given_name** | **str** |  | [optional] 
**additional_name** | **str** |  | [optional] 
**patronymic_name** | **str** |  | [optional] 
**honorific_prefix** | **str** |  | [optional] 
**honorific_suffix** | **str** |  | [optional] 
**family_name_prefix** | **str** |  | [optional] 
**date_of_birth** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.boost_send_boost_request_credential_any_of_issuer_any_of import BoostSendBoostRequestCredentialAnyOfIssuerAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendBoostRequestCredentialAnyOfIssuerAnyOf from a JSON string
boost_send_boost_request_credential_any_of_issuer_any_of_instance = BoostSendBoostRequestCredentialAnyOfIssuerAnyOf.from_json(json)
# print the JSON string representation of the object
print(BoostSendBoostRequestCredentialAnyOfIssuerAnyOf.to_json())

# convert the object into a dict
boost_send_boost_request_credential_any_of_issuer_any_of_dict = boost_send_boost_request_credential_any_of_issuer_any_of_instance.to_dict()
# create an instance of BoostSendBoostRequestCredentialAnyOfIssuerAnyOf from a dict
boost_send_boost_request_credential_any_of_issuer_any_of_from_dict = BoostSendBoostRequestCredentialAnyOfIssuerAnyOf.from_dict(boost_send_boost_request_credential_any_of_issuer_any_of_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


