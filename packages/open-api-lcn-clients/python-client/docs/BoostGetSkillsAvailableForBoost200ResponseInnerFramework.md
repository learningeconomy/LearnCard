# BoostGetSkillsAvailableForBoost200ResponseInnerFramework


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**name** | **str** |  | 
**description** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**source_uri** | **str** |  | [optional] 
**status** | **str** |  | [default to 'active']
**created_at** | **str** |  | [optional] 
**updated_at** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_skills_available_for_boost200_response_inner_framework import BoostGetSkillsAvailableForBoost200ResponseInnerFramework

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetSkillsAvailableForBoost200ResponseInnerFramework from a JSON string
boost_get_skills_available_for_boost200_response_inner_framework_instance = BoostGetSkillsAvailableForBoost200ResponseInnerFramework.from_json(json)
# print the JSON string representation of the object
print(BoostGetSkillsAvailableForBoost200ResponseInnerFramework.to_json())

# convert the object into a dict
boost_get_skills_available_for_boost200_response_inner_framework_dict = boost_get_skills_available_for_boost200_response_inner_framework_instance.to_dict()
# create an instance of BoostGetSkillsAvailableForBoost200ResponseInnerFramework from a dict
boost_get_skills_available_for_boost200_response_inner_framework_from_dict = BoostGetSkillsAvailableForBoost200ResponseInnerFramework.from_dict(boost_get_skills_available_for_boost200_response_inner_framework_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


