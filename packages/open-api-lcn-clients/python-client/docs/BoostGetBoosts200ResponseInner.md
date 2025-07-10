# BoostGetBoosts200ResponseInner


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
**uri** | **str** |  | 

## Example

```python
from openapi_client.models.boost_get_boosts200_response_inner import BoostGetBoosts200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoosts200ResponseInner from a JSON string
boost_get_boosts200_response_inner_instance = BoostGetBoosts200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoosts200ResponseInner.to_json())

# convert the object into a dict
boost_get_boosts200_response_inner_dict = boost_get_boosts200_response_inner_instance.to_dict()
# create an instance of BoostGetBoosts200ResponseInner from a dict
boost_get_boosts200_response_inner_from_dict = BoostGetBoosts200ResponseInner.from_dict(boost_get_boosts200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


