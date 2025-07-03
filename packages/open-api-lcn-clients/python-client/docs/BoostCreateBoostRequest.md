# BoostCreateBoostRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | [optional] 
**type** | **str** |  | [optional] 
**category** | **str** |  | [optional] 
**status** | **str** |  | [optional] 
**auto_connect_recipients** | **bool** |  | [optional] 
**meta** | **Dict[str, object]** |  | [optional] 
**allow_anyone_to_create_children** | **bool** |  | [optional] 
**credential** | [**BoostCreateBoostRequestCredential**](BoostCreateBoostRequestCredential.md) |  | 
**claim_permissions** | [**BoostCreateBoostRequestClaimPermissions**](BoostCreateBoostRequestClaimPermissions.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_create_boost_request import BoostCreateBoostRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostCreateBoostRequest from a JSON string
boost_create_boost_request_instance = BoostCreateBoostRequest.from_json(json)
# print the JSON string representation of the object
print(BoostCreateBoostRequest.to_json())

# convert the object into a dict
boost_create_boost_request_dict = boost_create_boost_request_instance.to_dict()
# create an instance of BoostCreateBoostRequest from a dict
boost_create_boost_request_from_dict = BoostCreateBoostRequest.from_dict(boost_create_boost_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


