# SkillsSemanticSearchSkillsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**text** | **str** |  | 
**framework_id** | **str** |  | [optional] 
**limit** | **int** |  | [optional] [default to 50]

## Example

```python
from openapi_client.models.skills_semantic_search_skills_request import SkillsSemanticSearchSkillsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of SkillsSemanticSearchSkillsRequest from a JSON string
skills_semantic_search_skills_request_instance = SkillsSemanticSearchSkillsRequest.from_json(json)
# print the JSON string representation of the object
print(SkillsSemanticSearchSkillsRequest.to_json())

# convert the object into a dict
skills_semantic_search_skills_request_dict = skills_semantic_search_skills_request_instance.to_dict()
# create an instance of SkillsSemanticSearchSkillsRequest from a dict
skills_semantic_search_skills_request_from_dict = SkillsSemanticSearchSkillsRequest.from_dict(skills_semantic_search_skills_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


