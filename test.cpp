/*
 * @Author: FlowerRealm admin@flowerrealm.top
 * @Date: 2025-05-27 19:06:02
 * @LastEditors: FlowerRealm admin@flowerrealm.top
 * @LastEditTime: 2025-05-27 19:14:20
 * @FilePath: /GameConnecting/test.cpp
 */
#include <iostream>
template <typename type>
class tree {
public:
    tree(type value = 0, int count = 1, int size = 1, tree* leftchild = nullptr, tree* rightchild = nullptr)
        : value(value)
        , count(count)
        , size(size)
        , leftchild(leftchild)
        , rightchild(rightchild)
    {
    }
    tree* GetLeftchild() { return leftchild; }
    tree* GetRightchild() { return rightchild; }

private:
    type value;
    int count;
    tree *leftchild, *rightchild;
    int size;
};
tree<int> root;
int main()
{
    return 0;
}