# BoostGetPaginatedBoostsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**query** | [**BoostGetBoostsRequestQuery**](BoostGetBoostsRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_paginated_boosts_request import BoostGetPaginatedBoostsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetPaginatedBoostsRequest from a JSON string
boost_get_paginated_boosts_request_instance = BoostGetPaginatedBoostsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostGetPaginatedBoostsRequest.to_json())

# convert the object into a dict
boost_get_paginated_boosts_request_dict = boost_get_paginated_boosts_request_instance.to_dict()
# create an instance of BoostGetPaginatedBoostsRequest from a dict
boost_get_paginated_boosts_request_from_dict = BoostGetPaginatedBoostsRequest.from_dict(boost_get_paginated_boosts_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


