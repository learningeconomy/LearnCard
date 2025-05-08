# BoostUpdateBoostRequestUpdates


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | [optional] 
**type** | **str** |  | [optional] 
**category** | **str** |  | [optional] 
**status** | **str** |  | [optional] 
**auto_connect_recipients** | **bool** |  | [optional] 
**meta** | **Dict[str, object]** |  | [optional] 
**credential** | [**BoostCreateBoostRequestCredential**](BoostCreateBoostRequestCredential.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_update_boost_request_updates import BoostUpdateBoostRequestUpdates

# TODO update the JSON string below
json = "{}"
# create an instance of BoostUpdateBoostRequestUpdates from a JSON string
boost_update_boost_request_updates_instance = BoostUpdateBoostRequestUpdates.from_json(json)
# print the JSON string representation of the object
print(BoostUpdateBoostRequestUpdates.to_json())

# convert the object into a dict
boost_update_boost_request_updates_dict = boost_update_boost_request_updates_instance.to_dict()
# create an instance of BoostUpdateBoostRequestUpdates from a dict
boost_update_boost_request_updates_from_dict = BoostUpdateBoostRequestUpdates.from_dict(boost_update_boost_request_updates_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


