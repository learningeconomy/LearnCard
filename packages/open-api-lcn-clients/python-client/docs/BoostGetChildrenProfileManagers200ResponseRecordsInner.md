# BoostGetChildrenProfileManagers200ResponseRecordsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**created** | **str** |  | 
**display_name** | **str** |  | [optional] [default to '']
**short_bio** | **str** |  | [optional] [default to '']
**bio** | **str** |  | [optional] [default to '']
**email** | **str** |  | [optional] 
**image** | **str** |  | [optional] 
**hero_image** | **str** |  | [optional] 
**did** | **str** |  | 

## Example

```python
from openapi_client.models.boost_get_children_profile_managers200_response_records_inner import BoostGetChildrenProfileManagers200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetChildrenProfileManagers200ResponseRecordsInner from a JSON string
boost_get_children_profile_managers200_response_records_inner_instance = BoostGetChildrenProfileManagers200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(BoostGetChildrenProfileManagers200ResponseRecordsInner.to_json())

# convert the object into a dict
boost_get_children_profile_managers200_response_records_inner_dict = boost_get_children_profile_managers200_response_records_inner_instance.to_dict()
# create an instance of BoostGetChildrenProfileManagers200ResponseRecordsInner from a dict
boost_get_children_profile_managers200_response_records_inner_from_dict = BoostGetChildrenProfileManagers200ResponseRecordsInner.from_dict(boost_get_children_profile_managers200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


