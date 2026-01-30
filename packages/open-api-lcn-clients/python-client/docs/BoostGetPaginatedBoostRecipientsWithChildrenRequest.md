# BoostGetPaginatedBoostRecipientsWithChildrenRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**uri** | **str** |  | 
**include_unaccepted_boosts** | **bool** |  | [optional] [default to True]
**number_of_generations** | [**BoostGetPaginatedBoostRecipientsWithChildrenRequestNumberOfGenerations**](BoostGetPaginatedBoostRecipientsWithChildrenRequestNumberOfGenerations.md) |  | [optional] 
**boost_query** | [**BoostGetBoostsRequestQuery**](BoostGetBoostsRequestQuery.md) |  | [optional] 
**profile_query** | [**BoostGetPaginatedBoostRecipientsRequestQuery**](BoostGetPaginatedBoostRecipientsRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_paginated_boost_recipients_with_children_request import BoostGetPaginatedBoostRecipientsWithChildrenRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetPaginatedBoostRecipientsWithChildrenRequest from a JSON string
boost_get_paginated_boost_recipients_with_children_request_instance = BoostGetPaginatedBoostRecipientsWithChildrenRequest.from_json(json)
# print the JSON string representation of the object
print(BoostGetPaginatedBoostRecipientsWithChildrenRequest.to_json())

# convert the object into a dict
boost_get_paginated_boost_recipients_with_children_request_dict = boost_get_paginated_boost_recipients_with_children_request_instance.to_dict()
# create an instance of BoostGetPaginatedBoostRecipientsWithChildrenRequest from a dict
boost_get_paginated_boost_recipients_with_children_request_from_dict = BoostGetPaginatedBoostRecipientsWithChildrenRequest.from_dict(boost_get_paginated_boost_recipients_with_children_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


