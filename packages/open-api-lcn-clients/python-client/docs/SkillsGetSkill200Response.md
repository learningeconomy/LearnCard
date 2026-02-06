# SkillsGetSkill200Response


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

## Example

```python
from openapi_client.models.skills_get_skill200_response import SkillsGetSkill200Response

# TODO update the JSON string below
json = "{}"
# create an instance of SkillsGetSkill200Response from a JSON string
skills_get_skill200_response_instance = SkillsGetSkill200Response.from_json(json)
# print the JSON string representation of the object
print(SkillsGetSkill200Response.to_json())

# convert the object into a dict
skills_get_skill200_response_dict = skills_get_skill200_response_instance.to_dict()
# create an instance of SkillsGetSkill200Response from a dict
skills_get_skill200_response_from_dict = SkillsGetSkill200Response.from_dict(skills_get_skill200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


