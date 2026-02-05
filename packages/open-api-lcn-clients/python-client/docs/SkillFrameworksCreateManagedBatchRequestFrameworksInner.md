# SkillFrameworksCreateManagedBatchRequestFrameworksInner


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
from openapi_client.models.skill_frameworks_create_managed_batch_request_frameworks_inner import SkillFrameworksCreateManagedBatchRequestFrameworksInner

# TODO update the JSON string below
json = "{}"
# create an instance of SkillFrameworksCreateManagedBatchRequestFrameworksInner from a JSON string
skill_frameworks_create_managed_batch_request_frameworks_inner_instance = SkillFrameworksCreateManagedBatchRequestFrameworksInner.from_json(json)
# print the JSON string representation of the object
print(SkillFrameworksCreateManagedBatchRequestFrameworksInner.to_json())

# convert the object into a dict
skill_frameworks_create_managed_batch_request_frameworks_inner_dict = skill_frameworks_create_managed_batch_request_frameworks_inner_instance.to_dict()
# create an instance of SkillFrameworksCreateManagedBatchRequestFrameworksInner from a dict
skill_frameworks_create_managed_batch_request_frameworks_inner_from_dict = SkillFrameworksCreateManagedBatchRequestFrameworksInner.from_dict(skill_frameworks_create_managed_batch_request_frameworks_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


