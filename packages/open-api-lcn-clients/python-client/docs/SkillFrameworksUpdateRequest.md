# SkillFrameworksUpdateRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**source_uri** | **str** |  | [optional] 
**status** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.skill_frameworks_update_request import SkillFrameworksUpdateRequest

# TODO update the JSON string below
json = "{}"
# create an instance of SkillFrameworksUpdateRequest from a JSON string
skill_frameworks_update_request_instance = SkillFrameworksUpdateRequest.from_json(json)
# print the JSON string representation of the object
print(SkillFrameworksUpdateRequest.to_json())

# convert the object into a dict
skill_frameworks_update_request_dict = skill_frameworks_update_request_instance.to_dict()
# create an instance of SkillFrameworksUpdateRequest from a dict
skill_frameworks_update_request_from_dict = SkillFrameworksUpdateRequest.from_dict(skill_frameworks_update_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


