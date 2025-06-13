# BoostGetChildrenProfileManagersRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**uri** | **str** |  | 
**query** | [**BoostGetChildrenProfileManagersRequestQuery**](BoostGetChildrenProfileManagersRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_children_profile_managers_request import BoostGetChildrenProfileManagersRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetChildrenProfileManagersRequest from a JSON string
boost_get_children_profile_managers_request_instance = BoostGetChildrenProfileManagersRequest.from_json(json)
# print the JSON string representation of the object
print(BoostGetChildrenProfileManagersRequest.to_json())

# convert the object into a dict
boost_get_children_profile_managers_request_dict = boost_get_children_profile_managers_request_instance.to_dict()
# create an instance of BoostGetChildrenProfileManagersRequest from a dict
boost_get_children_profile_managers_request_from_dict = BoostGetChildrenProfileManagersRequest.from_dict(boost_get_children_profile_managers_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


