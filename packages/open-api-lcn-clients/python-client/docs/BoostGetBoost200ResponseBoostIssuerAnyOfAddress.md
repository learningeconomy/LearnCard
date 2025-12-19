# BoostGetBoost200ResponseBoostIssuerAnyOfAddress


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | [**BoostSendBoostRequestCredentialAnyOfIssuerAnyOfAddressType**](BoostSendBoostRequestCredentialAnyOfIssuerAnyOfAddressType.md) |  | 
**address_country** | **str** |  | [optional] 
**address_country_code** | **str** |  | [optional] 
**address_region** | **str** |  | [optional] 
**address_locality** | **str** |  | [optional] 
**street_address** | **str** |  | [optional] 
**post_office_box_number** | **str** |  | [optional] 
**postal_code** | **str** |  | [optional] 
**geo** | [**BoostGetBoost200ResponseBoostIssuerAnyOfAddressGeo**](BoostGetBoost200ResponseBoostIssuerAnyOfAddressGeo.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_boost200_response_boost_issuer_any_of_address import BoostGetBoost200ResponseBoostIssuerAnyOfAddress

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoost200ResponseBoostIssuerAnyOfAddress from a JSON string
boost_get_boost200_response_boost_issuer_any_of_address_instance = BoostGetBoost200ResponseBoostIssuerAnyOfAddress.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoost200ResponseBoostIssuerAnyOfAddress.to_json())

# convert the object into a dict
boost_get_boost200_response_boost_issuer_any_of_address_dict = boost_get_boost200_response_boost_issuer_any_of_address_instance.to_dict()
# create an instance of BoostGetBoost200ResponseBoostIssuerAnyOfAddress from a dict
boost_get_boost200_response_boost_issuer_any_of_address_from_dict = BoostGetBoost200ResponseBoostIssuerAnyOfAddress.from_dict(boost_get_boost200_response_boost_issuer_any_of_address_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


