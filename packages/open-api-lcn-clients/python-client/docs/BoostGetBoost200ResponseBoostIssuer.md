# BoostGetBoost200ResponseBoostIssuer


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
**image** | [**BoostGetBoost200ResponseBoostIssuerAnyOfImage**](BoostGetBoost200ResponseBoostIssuerAnyOfImage.md) |  | [optional] 
**email** | **str** |  | [optional] 
**address** | [**BoostGetBoost200ResponseBoostIssuerAnyOfAddress**](BoostGetBoost200ResponseBoostIssuerAnyOfAddress.md) |  | [optional] 
**other_identifier** | [**List[BoostGetBoost200ResponseBoostIssuerAnyOfOtherIdentifierInner]**](BoostGetBoost200ResponseBoostIssuerAnyOfOtherIdentifierInner.md) |  | [optional] 
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
from openapi_client.models.boost_get_boost200_response_boost_issuer import BoostGetBoost200ResponseBoostIssuer

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoost200ResponseBoostIssuer from a JSON string
boost_get_boost200_response_boost_issuer_instance = BoostGetBoost200ResponseBoostIssuer.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoost200ResponseBoostIssuer.to_json())

# convert the object into a dict
boost_get_boost200_response_boost_issuer_dict = boost_get_boost200_response_boost_issuer_instance.to_dict()
# create an instance of BoostGetBoost200ResponseBoostIssuer from a dict
boost_get_boost200_response_boost_issuer_from_dict = BoostGetBoost200ResponseBoostIssuer.from_dict(boost_get_boost200_response_boost_issuer_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


