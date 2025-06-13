# BoostGetBoostAdminsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**include_self** | **bool** |  | [optional] [default to True]
**uri** | **str** |  | 

## Example

```python
from openapi_client.models.boost_get_boost_admins_request import BoostGetBoostAdminsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostAdminsRequest from a JSON string
boost_get_boost_admins_request_instance = BoostGetBoostAdminsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostAdminsRequest.to_json())

# convert the object into a dict
boost_get_boost_admins_request_dict = boost_get_boost_admins_request_instance.to_dict()
# create an instance of BoostGetBoostAdminsRequest from a dict
boost_get_boost_admins_request_from_dict = BoostGetBoostAdminsRequest.from_dict(boost_get_boost_admins_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


