# SkillsAddSkillTagRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**framework_id** | **str** |  | 
**tag** | [**SkillsAddSkillTagRequestTag**](SkillsAddSkillTagRequestTag.md) |  | 

## Example

```python
from openapi_client.models.skills_add_skill_tag_request import SkillsAddSkillTagRequest

# TODO update the JSON string below
json = "{}"
# create an instance of SkillsAddSkillTagRequest from a JSON string
skills_add_skill_tag_request_instance = SkillsAddSkillTagRequest.from_json(json)
# print the JSON string representation of the object
print(SkillsAddSkillTagRequest.to_json())

# convert the object into a dict
skills_add_skill_tag_request_dict = skills_add_skill_tag_request_instance.to_dict()
# create an instance of SkillsAddSkillTagRequest from a dict
skills_add_skill_tag_request_from_dict = SkillsAddSkillTagRequest.from_dict(skills_add_skill_tag_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


