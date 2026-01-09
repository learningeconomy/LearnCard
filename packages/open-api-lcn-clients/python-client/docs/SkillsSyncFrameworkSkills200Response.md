# SkillsSyncFrameworkSkills200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**framework** | [**BoostGetBoostFrameworks200ResponseRecordsInner**](BoostGetBoostFrameworks200ResponseRecordsInner.md) |  | 
**skills** | [**SkillsGetFrameworkSkillTree200Response**](SkillsGetFrameworkSkillTree200Response.md) |  | 

## Example

```python
from openapi_client.models.skills_sync_framework_skills200_response import SkillsSyncFrameworkSkills200Response

# TODO update the JSON string below
json = "{}"
# create an instance of SkillsSyncFrameworkSkills200Response from a JSON string
skills_sync_framework_skills200_response_instance = SkillsSyncFrameworkSkills200Response.from_json(json)
# print the JSON string representation of the object
print(SkillsSyncFrameworkSkills200Response.to_json())

# convert the object into a dict
skills_sync_framework_skills200_response_dict = skills_sync_framework_skills200_response_instance.to_dict()
# create an instance of SkillsSyncFrameworkSkills200Response from a dict
skills_sync_framework_skills200_response_from_dict = SkillsSyncFrameworkSkills200Response.from_dict(skills_sync_framework_skills200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


