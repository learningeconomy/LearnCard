# BoostGetPaginatedBoostRecipientsWithChildren200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cursor** | **str** |  | [optional] 
**has_more** | **bool** |  | 
**records** | [**List[BoostGetPaginatedBoostRecipientsWithChildren200ResponseRecordsInner]**](BoostGetPaginatedBoostRecipientsWithChildren200ResponseRecordsInner.md) |  | 

## Example

```python
from openapi_client.models.boost_get_paginated_boost_recipients_with_children200_response import BoostGetPaginatedBoostRecipientsWithChildren200Response

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetPaginatedBoostRecipientsWithChildren200Response from a JSON string
boost_get_paginated_boost_recipients_with_children200_response_instance = BoostGetPaginatedBoostRecipientsWithChildren200Response.from_json(json)
# print the JSON string representation of the object
print(BoostGetPaginatedBoostRecipientsWithChildren200Response.to_json())

# convert the object into a dict
boost_get_paginated_boost_recipients_with_children200_response_dict = boost_get_paginated_boost_recipients_with_children200_response_instance.to_dict()
# create an instance of BoostGetPaginatedBoostRecipientsWithChildren200Response from a dict
boost_get_paginated_boost_recipients_with_children200_response_from_dict = BoostGetPaginatedBoostRecipientsWithChildren200Response.from_dict(boost_get_paginated_boost_recipients_with_children200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


