# SkillsSemanticSearchSkills200ResponseRecordsInner


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
**score** | **float** |  | 

## Example

```python
from openapi_client.models.skills_semantic_search_skills200_response_records_inner import SkillsSemanticSearchSkills200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of SkillsSemanticSearchSkills200ResponseRecordsInner from a JSON string
skills_semantic_search_skills200_response_records_inner_instance = SkillsSemanticSearchSkills200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(SkillsSemanticSearchSkills200ResponseRecordsInner.to_json())

# convert the object into a dict
skills_semantic_search_skills200_response_records_inner_dict = skills_semantic_search_skills200_response_records_inner_instance.to_dict()
# create an instance of SkillsSemanticSearchSkills200ResponseRecordsInner from a dict
skills_semantic_search_skills200_response_records_inner_from_dict = SkillsSemanticSearchSkills200ResponseRecordsInner.from_dict(skills_semantic_search_skills200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


