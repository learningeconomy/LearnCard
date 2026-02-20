# SkillsGetFrameworkSkillTree200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**has_more** | **bool** |  | 
**cursor** | **str** |  | 
**records** | [**List[Schema1]**](Schema1.md) |  | 

## Example

```python
from openapi_client.models.skills_get_framework_skill_tree200_response import SkillsGetFrameworkSkillTree200Response

# TODO update the JSON string below
json = "{}"
# create an instance of SkillsGetFrameworkSkillTree200Response from a JSON string
skills_get_framework_skill_tree200_response_instance = SkillsGetFrameworkSkillTree200Response.from_json(json)
# print the JSON string representation of the object
print(SkillsGetFrameworkSkillTree200Response.to_json())

# convert the object into a dict
skills_get_framework_skill_tree200_response_dict = skills_get_framework_skill_tree200_response_instance.to_dict()
# create an instance of SkillsGetFrameworkSkillTree200Response from a dict
skills_get_framework_skill_tree200_response_from_dict = SkillsGetFrameworkSkillTree200Response.from_dict(skills_get_framework_skill_tree200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


