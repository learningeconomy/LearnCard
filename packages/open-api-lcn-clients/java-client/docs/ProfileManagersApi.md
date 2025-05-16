# ProfileManagersApi

All URIs are relative to *https://network.learncard.com/api*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**boostGetChildrenProfileManagers**](ProfileManagersApi.md#boostGetChildrenProfileManagers) | **POST** /boost/children-profile-managers | Get Profile Managers that are a child of a boost |
| [**profileManagerCreateChildProfileManager**](ProfileManagersApi.md#profileManagerCreateChildProfileManager) | **POST** /profile-manager/create-child | Create a profile manager that is a child of a Boost |
| [**profileManagerCreateManagedProfile**](ProfileManagersApi.md#profileManagerCreateManagedProfile) | **POST** /profile/create-managed-profile | Create a managed profile |
| [**profileManagerCreateProfileManager**](ProfileManagersApi.md#profileManagerCreateProfileManager) | **POST** /profile-manager/create | Create a profile manager |
| [**profileManagerGetManagedProfiles**](ProfileManagersApi.md#profileManagerGetManagedProfiles) | **POST** /profile/managed-profiles | Managed Profiles |
| [**profileManagerGetOtherProfileManager**](ProfileManagersApi.md#profileManagerGetOtherProfileManager) | **GET** /profile-manager/{id} | Get profile manager information |
| [**profileManagerGetProfileManager**](ProfileManagersApi.md#profileManagerGetProfileManager) | **GET** /profile-manager | Get your profile manager profile information |
| [**profileManagerUpdateProfileManager**](ProfileManagersApi.md#profileManagerUpdateProfileManager) | **POST** /profile-manager | Update the profile of your Profile Manager |


<a id="boostGetChildrenProfileManagers"></a>
# **boostGetChildrenProfileManagers**
> BoostGetChildrenProfileManagers200Response boostGetChildrenProfileManagers(boostGetChildrenProfileManagersRequest)

Get Profile Managers that are a child of a boost

Get Profile Managers that are a child of a boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfileManagersApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfileManagersApi apiInstance = new ProfileManagersApi(defaultClient);
    BoostGetChildrenProfileManagersRequest boostGetChildrenProfileManagersRequest = new BoostGetChildrenProfileManagersRequest(); // BoostGetChildrenProfileManagersRequest | 
    try {
      BoostGetChildrenProfileManagers200Response result = apiInstance.boostGetChildrenProfileManagers(boostGetChildrenProfileManagersRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfileManagersApi#boostGetChildrenProfileManagers");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **boostGetChildrenProfileManagersRequest** | [**BoostGetChildrenProfileManagersRequest**](BoostGetChildrenProfileManagersRequest.md)|  | |

### Return type

[**BoostGetChildrenProfileManagers200Response**](BoostGetChildrenProfileManagers200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="profileManagerCreateChildProfileManager"></a>
# **profileManagerCreateChildProfileManager**
> String profileManagerCreateChildProfileManager(profileManagerCreateChildProfileManagerRequest)

Create a profile manager that is a child of a Boost

Creates a profile manager that is a child of a Boost

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfileManagersApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfileManagersApi apiInstance = new ProfileManagersApi(defaultClient);
    ProfileManagerCreateChildProfileManagerRequest profileManagerCreateChildProfileManagerRequest = new ProfileManagerCreateChildProfileManagerRequest(); // ProfileManagerCreateChildProfileManagerRequest | 
    try {
      String result = apiInstance.profileManagerCreateChildProfileManager(profileManagerCreateChildProfileManagerRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfileManagersApi#profileManagerCreateChildProfileManager");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileManagerCreateChildProfileManagerRequest** | [**ProfileManagerCreateChildProfileManagerRequest**](ProfileManagerCreateChildProfileManagerRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="profileManagerCreateManagedProfile"></a>
# **profileManagerCreateManagedProfile**
> String profileManagerCreateManagedProfile(profileManagerCreateManagedProfileRequest)

Create a managed profile

Creates a managed profile

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfileManagersApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfileManagersApi apiInstance = new ProfileManagersApi(defaultClient);
    ProfileManagerCreateManagedProfileRequest profileManagerCreateManagedProfileRequest = new ProfileManagerCreateManagedProfileRequest(); // ProfileManagerCreateManagedProfileRequest | 
    try {
      String result = apiInstance.profileManagerCreateManagedProfile(profileManagerCreateManagedProfileRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfileManagersApi#profileManagerCreateManagedProfile");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileManagerCreateManagedProfileRequest** | [**ProfileManagerCreateManagedProfileRequest**](ProfileManagerCreateManagedProfileRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="profileManagerCreateProfileManager"></a>
# **profileManagerCreateProfileManager**
> String profileManagerCreateProfileManager(profileManagerCreateProfileManagerRequest)

Create a profile manager

Creates a profile manager

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfileManagersApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfileManagersApi apiInstance = new ProfileManagersApi(defaultClient);
    ProfileManagerCreateProfileManagerRequest profileManagerCreateProfileManagerRequest = new ProfileManagerCreateProfileManagerRequest(); // ProfileManagerCreateProfileManagerRequest | 
    try {
      String result = apiInstance.profileManagerCreateProfileManager(profileManagerCreateProfileManagerRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfileManagersApi#profileManagerCreateProfileManager");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileManagerCreateProfileManagerRequest** | [**ProfileManagerCreateProfileManagerRequest**](ProfileManagerCreateProfileManagerRequest.md)|  | |

### Return type

**String**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="profileManagerGetManagedProfiles"></a>
# **profileManagerGetManagedProfiles**
> BoostGetBoostAdmins200Response profileManagerGetManagedProfiles(profileGetAvailableProfilesRequest)

Managed Profiles

This route gets all of your managed profiles

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfileManagersApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");

    ProfileManagersApi apiInstance = new ProfileManagersApi(defaultClient);
    ProfileGetAvailableProfilesRequest profileGetAvailableProfilesRequest = new ProfileGetAvailableProfilesRequest(); // ProfileGetAvailableProfilesRequest | 
    try {
      BoostGetBoostAdmins200Response result = apiInstance.profileManagerGetManagedProfiles(profileGetAvailableProfilesRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfileManagersApi#profileManagerGetManagedProfiles");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileGetAvailableProfilesRequest** | [**ProfileGetAvailableProfilesRequest**](ProfileGetAvailableProfilesRequest.md)|  | [optional] |

### Return type

[**BoostGetBoostAdmins200Response**](BoostGetBoostAdmins200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="profileManagerGetOtherProfileManager"></a>
# **profileManagerGetOtherProfileManager**
> ProfileManagerGetProfileManager200Response profileManagerGetOtherProfileManager(id)

Get profile manager information

This route grabs the profile information of any profile manager, using their id

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfileManagersApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");

    ProfileManagersApi apiInstance = new ProfileManagersApi(defaultClient);
    String id = "id_example"; // String | 
    try {
      ProfileManagerGetProfileManager200Response result = apiInstance.profileManagerGetOtherProfileManager(id);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfileManagersApi#profileManagerGetOtherProfileManager");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **id** | **String**|  | |

### Return type

[**ProfileManagerGetProfileManager200Response**](ProfileManagerGetProfileManager200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="profileManagerGetProfileManager"></a>
# **profileManagerGetProfileManager**
> ProfileManagerGetProfileManager200Response profileManagerGetProfileManager()

Get your profile manager profile information

This route uses the request header to grab the profile manager profile of the current profile manager

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfileManagersApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfileManagersApi apiInstance = new ProfileManagersApi(defaultClient);
    try {
      ProfileManagerGetProfileManager200Response result = apiInstance.profileManagerGetProfileManager();
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfileManagersApi#profileManagerGetProfileManager");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ProfileManagerGetProfileManager200Response**](ProfileManagerGetProfileManager200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

<a id="profileManagerUpdateProfileManager"></a>
# **profileManagerUpdateProfileManager**
> Boolean profileManagerUpdateProfileManager(profileManagerCreateProfileManagerRequest)

Update the profile of your Profile Manager

This route updates the profile of the current profile manager

### Example
```java
// Import classes:
import org.openapitools.client.ApiClient;
import org.openapitools.client.ApiException;
import org.openapitools.client.Configuration;
import org.openapitools.client.auth.*;
import org.openapitools.client.models.*;
import org.openapitools.client.api.ProfileManagersApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://network.learncard.com/api");
    
    // Configure HTTP bearer authorization: Authorization
    HttpBearerAuth Authorization = (HttpBearerAuth) defaultClient.getAuthentication("Authorization");
    Authorization.setBearerToken("BEARER TOKEN");

    ProfileManagersApi apiInstance = new ProfileManagersApi(defaultClient);
    ProfileManagerCreateProfileManagerRequest profileManagerCreateProfileManagerRequest = new ProfileManagerCreateProfileManagerRequest(); // ProfileManagerCreateProfileManagerRequest | 
    try {
      Boolean result = apiInstance.profileManagerUpdateProfileManager(profileManagerCreateProfileManagerRequest);
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling ProfileManagersApi#profileManagerUpdateProfileManager");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

### Parameters

| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **profileManagerCreateProfileManagerRequest** | [**ProfileManagerCreateProfileManagerRequest**](ProfileManagerCreateProfileManagerRequest.md)|  | |

### Return type

**Boolean**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Successful response |  -  |
| **0** | Error response |  -  |

