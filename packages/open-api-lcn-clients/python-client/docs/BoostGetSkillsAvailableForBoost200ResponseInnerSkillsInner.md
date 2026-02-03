# BoostGetSkillsAvailableForBoost200ResponseInnerSkillsInner


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

## Example

```python
from openapi_client.models.boost_get_skills_available_for_boost200_response_inner_skills_inner import BoostGetSkillsAvailableForBoost200ResponseInnerSkillsInner

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetSkillsAvailableForBoost200ResponseInnerSkillsInner from a JSON string
boost_get_skills_available_for_boost200_response_inner_skills_inner_instance = BoostGetSkillsAvailableForBoost200ResponseInnerSkillsInner.from_json(json)
# print the JSON string representation of the object
print(BoostGetSkillsAvailableForBoost200ResponseInnerSkillsInner.to_json())

# convert the object into a dict
boost_get_skills_available_for_boost200_response_inner_skills_inner_dict = boost_get_skills_available_for_boost200_response_inner_skills_inner_instance.to_dict()
# create an instance of BoostGetSkillsAvailableForBoost200ResponseInnerSkillsInner from a dict
boost_get_skills_available_for_boost200_response_inner_skills_inner_from_dict = BoostGetSkillsAvailableForBoost200ResponseInnerSkillsInner.from_dict(boost_get_skills_available_for_boost200_response_inner_skills_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


