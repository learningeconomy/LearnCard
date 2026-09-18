# BoostGetBoostSkills200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**statement** | **str** |  | 
**description** | **str** |  | [optional] 
**code** | **str** |  | [optional] 
**icon** | **str** |  | [optional] 
**type** | **str** |  | [default to 'skill']
**status** | **str** |  | [default to 'active']
**framework_id** | **str** |  | [optional] 
**created_at** | **str** |  | [optional] 
**updated_at** | **str** |  | [optional] 
**proficiency_level** | **float** |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_boost_skills200_response_inner import BoostGetBoostSkills200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostSkills200ResponseInner from a JSON string
boost_get_boost_skills200_response_inner_instance = BoostGetBoostSkills200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostSkills200ResponseInner.to_json())

# convert the object into a dict
boost_get_boost_skills200_response_inner_dict = boost_get_boost_skills200_response_inner_instance.to_dict()
# create an instance of BoostGetBoostSkills200ResponseInner from a dict
boost_get_boost_skills200_response_inner_from_dict = BoostGetBoostSkills200ResponseInner.from_dict(boost_get_boost_skills200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


