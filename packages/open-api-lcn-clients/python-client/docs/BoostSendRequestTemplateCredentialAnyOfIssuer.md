# BoostSendRequestTemplateCredentialAnyOfIssuer


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | [optional] 
**type** | [**BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType**](BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfType.md) |  | [optional] 
**name** | **str** |  | [optional] 
**url** | **str** |  | [optional] 
**phone** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**endorsement** | **List[object]** |  | [optional] 
**image** | [**BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfImage**](BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfImage.md) |  | [optional] 
**email** | **str** |  | [optional] 
**address** | [**BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfAddress**](BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfAddress.md) |  | [optional] 
**other_identifier** | [**List[BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfOtherIdentifierInner]**](BoostSendRequestTemplateCredentialAnyOfIssuerAnyOfOtherIdentifierInner.md) |  | [optional] 
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
from openapi_client.models.boost_send_request_template_credential_any_of_issuer import BoostSendRequestTemplateCredentialAnyOfIssuer

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSendRequestTemplateCredentialAnyOfIssuer from a JSON string
boost_send_request_template_credential_any_of_issuer_instance = BoostSendRequestTemplateCredentialAnyOfIssuer.from_json(json)
# print the JSON string representation of the object
print(BoostSendRequestTemplateCredentialAnyOfIssuer.to_json())

# convert the object into a dict
boost_send_request_template_credential_any_of_issuer_dict = boost_send_request_template_credential_any_of_issuer_instance.to_dict()
# create an instance of BoostSendRequestTemplateCredentialAnyOfIssuer from a dict
boost_send_request_template_credential_any_of_issuer_from_dict = BoostSendRequestTemplateCredentialAnyOfIssuer.from_dict(boost_send_request_template_credential_any_of_issuer_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


