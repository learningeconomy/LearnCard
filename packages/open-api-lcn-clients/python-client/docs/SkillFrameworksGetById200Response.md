# SkillFrameworksGetById200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**framework** | [**BoostGetBoostFrameworks200ResponseRecordsInner**](BoostGetBoostFrameworks200ResponseRecordsInner.md) |  | 
**skills** | [**SkillFrameworksGetById200ResponseSkills**](SkillFrameworksGetById200ResponseSkills.md) |  | 

## Example

```python
from openapi_client.models.skill_frameworks_get_by_id200_response import SkillFrameworksGetById200Response

# TODO update the JSON string below
json = "{}"
# create an instance of SkillFrameworksGetById200Response from a JSON string
skill_frameworks_get_by_id200_response_instance = SkillFrameworksGetById200Response.from_json(json)
# print the JSON string representation of the object
print(SkillFrameworksGetById200Response.to_json())

# convert the object into a dict
skill_frameworks_get_by_id200_response_dict = skill_frameworks_get_by_id200_response_instance.to_dict()
# create an instance of SkillFrameworksGetById200Response from a dict
skill_frameworks_get_by_id200_response_from_dict = SkillFrameworksGetById200Response.from_dict(skill_frameworks_get_by_id200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


