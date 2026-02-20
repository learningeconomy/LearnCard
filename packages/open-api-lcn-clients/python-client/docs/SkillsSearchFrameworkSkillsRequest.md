# SkillsSearchFrameworkSkillsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**query** | [**SkillsSearchFrameworkSkillsRequestQuery**](SkillsSearchFrameworkSkillsRequestQuery.md) |  | 
**limit** | **int** |  | [optional] [default to 50]
**cursor** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.skills_search_framework_skills_request import SkillsSearchFrameworkSkillsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of SkillsSearchFrameworkSkillsRequest from a JSON string
skills_search_framework_skills_request_instance = SkillsSearchFrameworkSkillsRequest.from_json(json)
# print the JSON string representation of the object
print(SkillsSearchFrameworkSkillsRequest.to_json())

# convert the object into a dict
skills_search_framework_skills_request_dict = skills_search_framework_skills_request_instance.to_dict()
# create an instance of SkillsSearchFrameworkSkillsRequest from a dict
skills_search_framework_skills_request_from_dict = SkillsSearchFrameworkSkillsRequest.from_dict(skills_search_framework_skills_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


