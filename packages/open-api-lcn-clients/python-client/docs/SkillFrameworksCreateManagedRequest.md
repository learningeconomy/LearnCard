# SkillFrameworksCreateManagedRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | [optional] 
**name** | **str** |  | 
**description** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**source_uri** | **str** |  | [optional] 
**status** | **str** |  | [optional] 
**skills** | [**List[Schema0]**](Schema0.md) |  | [optional] 
**boost_uris** | **List[str]** |  | [optional] 

## Example

```python
from openapi_client.models.skill_frameworks_create_managed_request import SkillFrameworksCreateManagedRequest

# TODO update the JSON string below
json = "{}"
# create an instance of SkillFrameworksCreateManagedRequest from a JSON string
skill_frameworks_create_managed_request_instance = SkillFrameworksCreateManagedRequest.from_json(json)
# print the JSON string representation of the object
print(SkillFrameworksCreateManagedRequest.to_json())

# convert the object into a dict
skill_frameworks_create_managed_request_dict = skill_frameworks_create_managed_request_instance.to_dict()
# create an instance of SkillFrameworksCreateManagedRequest from a dict
skill_frameworks_create_managed_request_from_dict = SkillFrameworksCreateManagedRequest.from_dict(skill_frameworks_create_managed_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


