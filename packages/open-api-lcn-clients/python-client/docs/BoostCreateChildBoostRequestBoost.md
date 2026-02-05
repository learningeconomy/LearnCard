# BoostCreateChildBoostRequestBoost


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
**default_permissions** | [**BoostCreateBoostRequestClaimPermissions**](BoostCreateBoostRequestClaimPermissions.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_create_child_boost_request_boost import BoostCreateChildBoostRequestBoost

# TODO update the JSON string below
json = "{}"
# create an instance of BoostCreateChildBoostRequestBoost from a JSON string
boost_create_child_boost_request_boost_instance = BoostCreateChildBoostRequestBoost.from_json(json)
# print the JSON string representation of the object
print(BoostCreateChildBoostRequestBoost.to_json())

# convert the object into a dict
boost_create_child_boost_request_boost_dict = boost_create_child_boost_request_boost_instance.to_dict()
# create an instance of BoostCreateChildBoostRequestBoost from a dict
boost_create_child_boost_request_boost_from_dict = BoostCreateChildBoostRequestBoost.from_dict(boost_create_child_boost_request_boost_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


