# Indigo Code Buildserver
Build server to be used with the Indigo Code coding competition framework. This is the default buildserver, and is maintained
in parallel with the [Indigo Code](https://github.com/sessamekesh/Indigo-Code) repository. The versions are necessarily
kept in sync - so be sure that you pay attention to which version of the Indigo Code Buildserver you are using when
installing Indigo Code, and make sure that they are compatible!

Like Indigo Code, this project is intended to be extended for your individual uses. It's designed with Indigo Code in mind,
and as such has special considerations for that project. It is, however, meant to be solely a build server, and you may use
it for whatever you please.

## General Ideas
Most of the API provides the developer with strong liberty in what they can do, lots of flexibility. However, there are
certain things that should remain constant, to prevent any collisions or confusion in configuration. Naming and version
definitions are important. All major versions of the buildserver should follow *at least* a minimum standard defined
for that major version. Minor versions may introduce additional features. Build versions should not be relevant,
unless there is a bugfix or something.

Minimum Required Data Specification for major version 0 (alpha):

- Product Namespace
- Version (`major`.`minor`.`build` format)
- Server UUID
- Build Constraints
    - Maximum Concurrent Tests Allowable
    - Queue Size
    - Results Availability
- Build Systems List
- Comparison Systems List

TODO KAM: Finish filling out this specification list

TODO KAM: Detail the REST api to be used