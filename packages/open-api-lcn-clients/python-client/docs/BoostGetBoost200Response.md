# BoostGetBoost200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | [optional] 
**type** | **str** |  | [optional] 
**category** | **str** |  | [optional] 
**status** | **str** |  | [optional] 
**auto_connect_recipients** | **bool** |  | [optional] 
**meta** | **Dict[str, object]** |  | [optional] 
**claim_permissions** | [**BoostGetBoost200ResponseClaimPermissions**](BoostGetBoost200ResponseClaimPermissions.md) |  | [optional] 
**uri** | **str** |  | 
**boost** | [**BoostCreateBoostRequestCredentialAnyOf**](BoostCreateBoostRequestCredentialAnyOf.md) |  | 

## Example

```python
from openapi_client.models.boost_get_boost200_response import BoostGetBoost200Response

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoost200Response from a JSON string
boost_get_boost200_response_instance = BoostGetBoost200Response.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoost200Response.to_json())

# convert the object into a dict
boost_get_boost200_response_dict = boost_get_boost200_response_instance.to_dict()
# create an instance of BoostGetBoost200Response from a dict
boost_get_boost200_response_from_dict = BoostGetBoost200Response.from_dict(boost_get_boost200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


